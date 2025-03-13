import React from 'react';
import { render, screen } from '@testing-library/react';
import Main from "../../../src/components/Main";

describe('Main component', () => {
  it('renders the main heading', () => {
    render(<Main />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('INTO-CPS > Welcome');
  });

  it('renders the welcome message', () => {
    render(<Main />);
    expect(screen.getByText('Welcome to the INTO-CPS Application')).toBeInTheDocument();
  });

  it('renders the application version with correct ID', () => {
    render(<Main />);
    const versionElement = screen.getByText('5.0.0');
    expect(versionElement).toBeInTheDocument();
    expect(versionElement).toHaveAttribute('id', 'appVersion');
  });
});
