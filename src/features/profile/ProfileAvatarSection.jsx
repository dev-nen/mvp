import { useEffect, useRef, useState } from "react";
import { Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import "./ProfileAvatarSection.css";

export function ProfileAvatarSection({ fullName = "", disabled = false }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSelectFile = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);

    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return nextPreviewUrl;
    });
  };

  return (
    <Card className="profile-avatar-section">
      <CardContent className="profile-avatar-section__content">
        <div className="profile-avatar-section__avatar-frame">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={fullName ? `Avatar de ${fullName}` : "Vista previa del avatar"}
              className="profile-avatar-section__image"
            />
          ) : (
            <div
              className="profile-avatar-section__placeholder"
              aria-label="Avatar sin foto"
            >
              <User className="profile-avatar-section__placeholder-icon" />
            </div>
          )}
        </div>

        <div className="profile-avatar-section__text">
          <h2 className="profile-avatar-section__title">Foto de perfil</h2>
          <p className="profile-avatar-section__description">
            Cambia tu foto por un flujo independiente al formulario principal.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="profile-avatar-section__input"
          onChange={handleSelectFile}
          disabled={disabled}
        />

        <Button
          type="button"
          variant="outline"
          className="profile-avatar-section__button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Camera />
          Cambiar foto
        </Button>

        <p className="profile-avatar-section__helper">
          {previewUrl
            ? "Vista previa lista. El guardado definitivo del avatar se conectara despues."
            : "Todavia no hay una foto subida para esta cuenta."}
        </p>
      </CardContent>
    </Card>
  );
}
