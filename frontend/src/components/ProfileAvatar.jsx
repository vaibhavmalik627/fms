import { useEffect, useState } from "react";
import { buildUploadsImageUrl } from "../utils/image";

function ProfileAvatar({ name, profileImage, large = false }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [profileImage]);

  const imageUrl = buildUploadsImageUrl(profileImage);
  const initial = (name || "U").trim().slice(0, 1).toUpperCase();

  if (!imageUrl || failed) {
    return <div className={large ? "avatar-placeholder lg" : "avatar-placeholder"}>{initial}</div>;
  }

  return (
    <img
      className={large ? "avatar lg" : "avatar"}
      src={imageUrl}
      alt={name || "Profile"}
      onError={() => setFailed(true)}
    />
  );
}

export default ProfileAvatar;
