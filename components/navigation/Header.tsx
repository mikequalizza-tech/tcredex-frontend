export const Header = () => {
  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "var(--neutral-700)",
      color: "white",
      padding: "0 var(--space-lg)",
      borderBottom: "1px solid var(--neutral-600)",
      fontSize: "1.1rem"
    }}>
      <div>tCredex Workspace</div>

      <div style={{ color: "var(--aiv-teal)" }}>
        Q • Admin
      </div>
    </header>
  );
};
