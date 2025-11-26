export const SideNav = () => {
  return (
    <nav style={{
      background: "var(--neutral-800)",
      borderRight: "1px solid var(--neutral-700)",
      padding: "var(--space-lg)",
      color: "var(--neutral-100)"
    }}>
      <div style={{
        marginBottom: "var(--space-xl)",
        fontSize: "1.4rem",
        color: "var(--tc-primary)",
        fontWeight: "bold"
      }}>
        tCredex
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {["Dashboard", "Projects", "Matching", "Documents", "Settings"].map((item) => (
          <li key={item} style={{
            marginBottom: "var(--space-md)",
            cursor: "pointer",
            padding: "var(--space-sm)",
            borderRadius: "var(--radius-sm)",
            transition: "background 0.2s",
          }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--neutral-700)"}
            onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
          >
            {item}
          </li>
        ))}
      </ul>
    </nav>
  );
};
