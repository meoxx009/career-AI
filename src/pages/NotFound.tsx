import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  EmptyState,
} from '../components/DesignSystem';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px 0', maxWidth: '640px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Eyebrow text="404 / NOT FOUND" />
        <DisplayHeading level={1}>PAGE NOT FOUND</DisplayHeading>
        <p className="muted-light" style={{ marginTop: '16px' }}>
          The requested page could not be found or may have moved.
        </p>
      </header>

      <EmptyState
        title="Looking for a career direction?"
        message="You can return to the overview page or jump directly into the role comparison and roadmap views."
        action={
          <PrimaryButton onClick={() => navigate('/')}>
            Return to Overview ↗
          </PrimaryButton>
        }
      />
    </div>
  );
};
