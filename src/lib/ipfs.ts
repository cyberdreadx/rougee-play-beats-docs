// IPFS utilities for fetching and validating data

const LIGHTHOUSE_GATEWAY = 'https://gateway.lighthouse.storage/ipfs';

export const getIPFSGatewayUrl = (cid: string): string => {
  if (!cid) return '';
  return `${LIGHTHOUSE_GATEWAY}/${cid}`;
};

export const fetchFromIPFS = async (cid: string): Promise<any> => {
  if (!cid) throw new Error('CID is required');
  
  const url = getIPFSGatewayUrl(cid);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
  }
  
  return response.json();
};

export const fetchProfileFromIPFS = async (metadataCid: string) => {
  const metadata = await fetchFromIPFS(metadataCid);
  return {
    ...metadata,
    avatarUrl: metadata.avatar_cid ? getIPFSGatewayUrl(metadata.avatar_cid) : null,
    coverUrl: metadata.cover_cid ? getIPFSGatewayUrl(metadata.cover_cid) : null,
  };
};

export const validateCID = (cid: string): boolean => {
  if (!cid) return false;
  // Basic CID validation (v0 and v1)
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58,})$/.test(cid);
};

export const getOptimizedImageUrl = (cid: string, width?: number): string => {
  const baseUrl = getIPFSGatewayUrl(cid);
  return width ? `${baseUrl}?w=${width}` : baseUrl;
};
