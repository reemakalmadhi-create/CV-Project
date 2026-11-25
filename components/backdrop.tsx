/** The brand aura behind every page: blurred, slowly drifting, with film grain. */
export function Backdrop() {
  return (
    <div className="ft-backdrop" aria-hidden>
      <div className="aura" />
      <div className="shade" />
      <div className="grain" />
    </div>
  );
}
