import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createPublicClient, http, parseAbiItem } from "https://esm.sh/viem@2.7.0"
import { base } from "https://esm.sh/viem@2.7.0/chains"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wallet-address',
};

const XRGE_TOKEN_ADDRESS = '0x147120faEC9277ec02d957584CFCD92B56A24317';
const TREASURY_ADDRESS = '0xYourTreasuryAddressHere'; // TODO: Set your treasury wallet address
const REQUIRED_XRGE_AMOUNT = '10000000000000000000'; // 10 XRGE in wei

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transactionHash, walletAddress } = await req.json()

    if (!transactionHash || !walletAddress) {
      throw new Error('Missing required parameters')
    }

    console.log('Processing slot purchase:', { transactionHash, walletAddress })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if transaction already processed
    const { data: existing } = await supabase
      .from('upload_slot_purchases')
      .select('id')
      .eq('transaction_hash', transactionHash)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Transaction already processed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify transaction on blockchain
    const publicClient = createPublicClient({
      chain: base,
      transport: http()
    })

    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`
    })

    if (!receipt || receipt.status !== 'success') {
      throw new Error('Transaction not found or failed')
    }

    // Parse transfer events to verify XRGE payment
    const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')
    
    let xrgePaid = '0'
    let validTransfer = false

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === XRGE_TOKEN_ADDRESS.toLowerCase()) {
        try {
          const decoded = publicClient.decodeEventLog({
            abi: [transferEvent],
            data: log.data,
            topics: log.topics
          })

          const from = decoded.args.from?.toLowerCase()
          const to = decoded.args.to?.toLowerCase()
          const value = decoded.args.value?.toString()

          // Verify: from = user wallet, to = treasury, value >= required amount
          if (
            from === walletAddress.toLowerCase() &&
            to === TREASURY_ADDRESS.toLowerCase() &&
            BigInt(value || '0') >= BigInt(REQUIRED_XRGE_AMOUNT)
          ) {
            xrgePaid = value
            validTransfer = true
            break
          }
        } catch (e) {
          console.log('Error decoding log:', e)
        }
      }
    }

    if (!validTransfer) {
      throw new Error('Valid XRGE payment not found in transaction')
    }

    console.log('Valid XRGE payment verified:', xrgePaid)

    // Process slot purchase in database
    const { data, error } = await supabase
      .rpc('process_slot_purchase', {
        artist_wallet: walletAddress.toLowerCase(),
        xrge_paid: xrgePaid,
        tx_hash: transactionHash,
        chain: 8453
      })

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Get updated slot count
    const { data: slotsRemaining } = await supabase
      .rpc('get_remaining_upload_slots', {
        artist_wallet: walletAddress.toLowerCase()
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: '20 upload slots added successfully',
        xrgePaid,
        slotsRemaining: slotsRemaining || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in purchase-upload-slots function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

