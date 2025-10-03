import Header from "@/components/Header";
import NetworkInfo from "@/components/NetworkInfo";
import Navigation from "@/components/Navigation";
import UploadMusic from "@/components/UploadMusic";

const Upload = () => {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <Navigation />
      <NetworkInfo />
      <div className="px-4 md:px-0">
        <UploadMusic />
      </div>
    </div>
  );
};

export default Upload;
