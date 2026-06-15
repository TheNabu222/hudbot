import React from "react";

interface StudioFeatureHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
}

export function StudioFeatureHeader({
  title,
  description,
  actions,
  tabs,
}: StudioFeatureHeaderProps) {
  return (
    <header className="studio-feature-header">
      <div className="studio-feature-header__main">
        <div className="studio-feature-header__copy">
          <h2 className="studio-feature-title">{title}</h2>
          <p className="studio-feature-description">{description}</p>
        </div>
        {actions && (
          <div className="studio-feature-actions">{actions}</div>
        )}
      </div>
      {tabs && <div className="studio-feature-tabs">{tabs}</div>}
    </header>
  );
}
