"use client";

import { Button } from "@/components/ui";

export default function Page() {
  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold mb-8">Button Variants</h1>

      {/* Primary */}
      <div className="mb-4">
        <Button variant="primary">Primary CTA</Button>
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="lg">Large</Button>
      </div>

      {/* Secondary */}
      <div className="mb-4">
        <Button variant="secondary">Secondary</Button>
        <Button variant="secondary" size="sm">Small</Button>
        <Button variant="secondary" size="lg">Large</Button>
      </div>

      {/* Ghost */}
      <div className="mb-4">
        <Button variant="ghost">Ghost</Button>
        <Button variant="ghost" size="sm">Small</Button>
        <Button variant="ghost" size="lg">Large</Button>
      </div>

      {/* Danger */}
      <div className="mb-4">
        <Button variant="danger">Danger</Button>
        <Button variant="danger" size="sm">Small</Button>
        <Button variant="danger" size="lg">Large</Button>
      </div>

      {/* Loading states */}
      <div className="mt-8">
        <span className="text-muted mb-4">Loading states:</span>
        <Button variant="primary" loading>Loading...</Button>
        <Button variant="secondary" loading>Loading...</Button>
        <Button variant="danger" loading>Loading...</Button>
      </div>

      {/* Disabled states */}
      <div className="mt-8">
        <span className="text-muted mb-4">Disabled states:</span>
        <Button variant="primary" disabled>Disabled</Button>
        <Button variant="secondary" disabled>Disabled</Button>
      </div>
    </div>
  );
}