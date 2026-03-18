import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import "./ProfileForm.css";

export function ProfileForm({
  profile,
  cityOptions,
  fieldErrors,
  formError,
  successMessage,
  disabled = false,
  isDirty = false,
  onChange,
  onBlur,
  onSubmit,
}) {
  if (!profile) {
    return null;
  }

  return (
    <Card>
      <CardContent className="profile-form__content">
        <div className="profile-form__header">
          <h2 className="profile-form__title">Tus datos</h2>
          <p className="profile-form__description">
            Edita la informacion basica de tu cuenta. El email se muestra solo
            como referencia.
          </p>
        </div>

        {formError ? (
          <div className="profile-form__feedback profile-form__feedback--error" role="alert">
            {formError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="profile-form__feedback profile-form__feedback--success" role="status">
            {successMessage}
          </div>
        ) : null}

        <form className="profile-form" onSubmit={onSubmit} noValidate>
          <fieldset className="profile-form__fieldset" disabled={disabled}>
            <div className="profile-form__field">
              <label className="profile-form__label" htmlFor="profile-first-name">
                Nombre
              </label>
              <Input
                id="profile-first-name"
                value={profile.firstName}
                onChange={(event) => onChange("firstName", event.target.value)}
                onBlur={() => onBlur("firstName")}
                aria-invalid={Boolean(fieldErrors.firstName)}
              />
              {fieldErrors.firstName ? (
                <p className="profile-form__error">{fieldErrors.firstName}</p>
              ) : null}
            </div>

            <div className="profile-form__field">
              <label className="profile-form__label" htmlFor="profile-last-name">
                Apellido
              </label>
              <Input
                id="profile-last-name"
                value={profile.lastName}
                onChange={(event) => onChange("lastName", event.target.value)}
                onBlur={() => onBlur("lastName")}
                aria-invalid={Boolean(fieldErrors.lastName)}
              />
              {fieldErrors.lastName ? (
                <p className="profile-form__error">{fieldErrors.lastName}</p>
              ) : null}
            </div>

            <div className="profile-form__field">
              <span className="profile-form__label">Email</span>
              <div className="profile-form__readonly-block">
                <p className="profile-form__readonly-value">{profile.email}</p>
                <p className="profile-form__readonly-help">
                  Este dato pertenece a tu cuenta y no se edita desde aqui.
                </p>
              </div>
            </div>

            <div className="profile-form__field">
              <label className="profile-form__label" htmlFor="profile-city">
                Tu ciudad
              </label>
              <select
                id="profile-city"
                className="profile-form__select"
                value={profile.city}
                onChange={(event) => onChange("city", event.target.value)}
                onBlur={() => onBlur("city")}
                aria-invalid={Boolean(fieldErrors.city)}
              >
                <option value="">Selecciona una ciudad</option>
                {cityOptions.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
              {fieldErrors.city ? (
                <p className="profile-form__error">{fieldErrors.city}</p>
              ) : null}
            </div>

            <div className="profile-form__actions">
              <Button type="submit" disabled={!isDirty || disabled}>
                Guardar cambios
              </Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
