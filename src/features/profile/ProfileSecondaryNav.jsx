import { ChevronRight, Heart, LifeBuoy } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import "./ProfileSecondaryNav.css";

const NAV_ITEMS = [
  {
    to: "/favoritos",
    title: "Favoritos",
    description: "Consulta las actividades que guardaste para revisar despues.",
    icon: Heart,
  },
  {
    to: "/soporte",
    title: "Soporte",
    description: "Encuentra ayuda basica mientras terminamos el centro de soporte.",
    icon: LifeBuoy,
  },
];

export function ProfileSecondaryNav() {
  return (
    <Card>
      <CardContent className="profile-secondary-nav__content">
        <div className="profile-secondary-nav__header">
          <h2 className="profile-secondary-nav__title">Accesos</h2>
          <p className="profile-secondary-nav__description">
            Navega rapido a otras areas relacionadas con tu cuenta.
          </p>
        </div>

        <div className="profile-secondary-nav__list">
          {NAV_ITEMS.map(({ to, title, description, icon: Icon }) => (
            <Link key={to} to={to} className="profile-secondary-nav__item">
              <div className="profile-secondary-nav__item-icon-wrap">
                <Icon className="profile-secondary-nav__item-icon" />
              </div>

              <div className="profile-secondary-nav__item-copy">
                <span className="profile-secondary-nav__item-title">{title}</span>
                <span className="profile-secondary-nav__item-description">
                  {description}
                </span>
              </div>

              <ChevronRight className="profile-secondary-nav__item-chevron" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
