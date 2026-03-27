import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { LogoutConfirmDialog } from "@/features/profile/LogoutConfirmDialog";
import { ProfileAvatarSection } from "@/features/profile/ProfileAvatarSection";
import { ProfileForm } from "@/features/profile/ProfileForm";
import { ProfileSecondaryNav } from "@/features/profile/ProfileSecondaryNav";
import "./ProfilePage.css";

const CITY_OPTIONS = ["Sitges", "Sant Pere de Ribes", "Roquetes"];
const MOCK_PROFILE = {
  firstName: "Maria Jesus",
  lastName: "de los Santos Amores",
  email: "maria.amores@nendo.app",
  city: "Sitges",
};

function mockLoadProfile() {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(MOCK_PROFILE), 500);
  });
}

function mockSaveProfile(profile) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (profile.firstName.trim().toLowerCase() === "error") {
        reject(
          new Error(
            "No pudimos guardar los cambios. Prueba de nuevo en unos segundos.",
          ),
        );
        return;
      }

      resolve(profile);
    }, 800);
  });
}

function normalizeProfile(profile) {
  return {
    ...profile,
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    city: profile.city.trim(),
  };
}

function validateField(name, value) {
  if (name === "firstName" && !value.trim()) {
    return "El nombre es obligatorio.";
  }

  if (name === "lastName" && !value.trim()) {
    return "El apellido es obligatorio.";
  }

  if (name === "city" && !value.trim()) {
    return "Selecciona una ciudad.";
  }

  return "";
}

function validateProfile(profile) {
  const nextErrors = {};

  ["firstName", "lastName", "city"].forEach((fieldName) => {
    const errorMessage = validateField(fieldName, profile[fieldName] ?? "");

    if (errorMessage) {
      nextErrors[fieldName] = errorMessage;
    }
  });

  return nextErrors;
}

function hasProfileChanges(initialProfile, draftProfile) {
  if (!initialProfile || !draftProfile) {
    return false;
  }

  return (
    initialProfile.firstName !== draftProfile.firstName ||
    initialProfile.lastName !== draftProfile.lastName ||
    initialProfile.city !== draftProfile.city
  );
}

function ProfileSkeleton() {
  return (
    <div className="profile-page__grid" aria-hidden="true">
      <div className="profile-page__skeleton-card profile-page__skeleton-card--avatar">
        <div className="profile-page__skeleton profile-page__skeleton--avatar" />
        <div className="profile-page__skeleton profile-page__skeleton--title" />
        <div className="profile-page__skeleton profile-page__skeleton--line" />
        <div className="profile-page__skeleton profile-page__skeleton--button" />
      </div>

      <div className="profile-page__stack">
        <div className="profile-page__skeleton-card">
          <div className="profile-page__skeleton profile-page__skeleton--heading" />
          <div className="profile-page__skeleton profile-page__skeleton--field" />
          <div className="profile-page__skeleton profile-page__skeleton--field" />
          <div className="profile-page__skeleton profile-page__skeleton--field" />
          <div className="profile-page__skeleton profile-page__skeleton--field" />
          <div className="profile-page__skeleton profile-page__skeleton--button-wide" />
        </div>

        <div className="profile-page__skeleton-card">
          <div className="profile-page__skeleton profile-page__skeleton--heading" />
          <div className="profile-page__skeleton profile-page__skeleton--row" />
          <div className="profile-page__skeleton profile-page__skeleton--row" />
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [initialProfile, setInitialProfile] = useState(null);
  const [draftProfile, setDraftProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const profile = await mockLoadProfile();

      if (!isMounted) {
        return;
      }

      setInitialProfile(profile);
      setDraftProfile(profile);
      setFieldErrors({});
      setFormError("");
      setSaveSuccessMessage("");
      setIsLoading(false);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const isDirty = useMemo(
    () => hasProfileChanges(initialProfile, draftProfile),
    [initialProfile, draftProfile],
  );

  const handleFieldChange = (fieldName, value) => {
    setDraftProfile((prevProfile) => ({
      ...prevProfile,
      [fieldName]: value,
    }));
    setSaveSuccessMessage("");

    if (fieldErrors[fieldName]) {
      setFieldErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        delete nextErrors[fieldName];
        return nextErrors;
      });
    }

    if (formError) {
      setFormError("");
    }
  };

  const handleFieldBlur = (fieldName) => {
    const fieldValue = draftProfile?.[fieldName] ?? "";
    const errorMessage = validateField(fieldName, fieldValue);

    setFieldErrors((prevErrors) => {
      const nextErrors = { ...prevErrors };

      if (errorMessage) {
        nextErrors[fieldName] = errorMessage;
      } else {
        delete nextErrors[fieldName];
      }

      return nextErrors;
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!draftProfile) {
      return;
    }

    const normalizedProfile = normalizeProfile(draftProfile);
    const nextErrors = validateProfile(normalizedProfile);

    setFieldErrors(nextErrors);
    setSaveSuccessMessage("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      const savedProfile = await mockSaveProfile(normalizedProfile);

      setInitialProfile(savedProfile);
      setDraftProfile(savedProfile);
      setSaveSuccessMessage("Tus cambios se guardaron correctamente.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No pudimos guardar los cambios. Intenta de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    navigate("/", { replace: true });
  };

  const handleConfirmLogout = () => {
    setIsLogoutOpen(false);
    navigate("/");
  };

  const fullName = draftProfile
    ? `${draftProfile.firstName} ${draftProfile.lastName}`.trim()
    : "";

  return (
    <div className="profile-page">
      <Navbar />

      <main className="profile-page__main">
        <div className="page-container profile-page__container">
          <header className="profile-page__header">
            <Button
              variant="ghost"
              className="profile-page__back-button"
              onClick={handleGoBack}
            >
              <ArrowLeft />
              Volver
            </Button>

            <div className="profile-page__intro">
              <p className="profile-page__eyebrow">Perfil</p>
              <h1 className="profile-page__title">Tu cuenta</h1>
              <p className="profile-page__description">
                Actualiza tus datos personales, revisa accesos utiles y gestiona
                tu sesion desde un solo lugar.
              </p>
            </div>
          </header>

          {isLoading ? (
            <ProfileSkeleton />
          ) : (
            <div className="profile-page__grid">
              <ProfileAvatarSection fullName={fullName} disabled={isSaving} />

              <div className="profile-page__stack">
                <ProfileForm
                  profile={draftProfile}
                  cityOptions={CITY_OPTIONS}
                  fieldErrors={fieldErrors}
                  formError={formError}
                  successMessage={saveSuccessMessage}
                  disabled={isSaving}
                  isDirty={isDirty}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  onSubmit={handleSave}
                />

                <ProfileSecondaryNav />

                <section className="profile-page__logout-section">
                  <h2 className="profile-page__logout-title">Sesion</h2>
                  <p className="profile-page__logout-description">
                    Cierra la sesion actual si estas usando un dispositivo
                    compartido.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="profile-page__logout-button"
                    onClick={() => setIsLogoutOpen(true)}
                    disabled={isSaving}
                  >
                    Cerrar sesion
                  </Button>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {isSaving ? (
        <div
          className="profile-page__saving-overlay"
          role="status"
          aria-live="polite"
        >
          <div className="profile-page__saving-panel">
            <div className="profile-page__skeleton profile-page__skeleton--saving" />
            <p>Guardando cambios...</p>
          </div>
        </div>
      ) : null}

      <LogoutConfirmDialog
        open={isLogoutOpen}
        onCancel={() => setIsLogoutOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
