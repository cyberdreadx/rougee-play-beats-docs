import Header from "@/components/Header";
import NetworkInfo from "@/components/NetworkInfo";
import UploadMusic from "@/components/UploadMusic";

const Upload = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NetworkInfo />
      <UploadMusic />
    </div>
  );
};

export default Upload;
