import React from 'react';

export const MaintenancePage: React.FC = () => {
  return (
    <div className="maintenance-page" role="status" aria-live="polite">
      <div className="clay-blob clay-blob-a" aria-hidden="true" />
      <div className="clay-blob clay-blob-b" aria-hidden="true" />
      <div className="clay-blob clay-blob-c" aria-hidden="true" />
      <div className="clay-blob clay-blob-d" aria-hidden="true" />

      <div className="clay-plaque">
        <div className="clay-dot-row" aria-hidden="true">
          <span className="clay-dot clay-dot-pink" />
          <span className="clay-dot clay-dot-mint" />
          <span className="clay-dot clay-dot-lavender" />
        </div>

        <p className="clay-kicker">PipNex AI</p>

        <h1 className="clay-heading">
          Under Maintenance
          <span className="clay-heading-line">for 3hrs</span>
        </h1>

        <p className="clay-subcopy">
          We are polishing things behind the scenes. Please check back shortly.
        </p>
      </div>
    </div>
  );
};
