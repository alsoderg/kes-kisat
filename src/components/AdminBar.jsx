export default function AdminBar({ isAdmin, onToggleAdmin, onResetAll }) {
  return (
    <div className="admin-bar">
      <button className={`admin-toggle ${isAdmin ? "is-admin" : ""}`} onClick={onToggleAdmin}>
        {isAdmin ? "🔓 Admin-tila päällä" : "🔒 Admin-kirjautuminen"}
      </button>
      {isAdmin && (
        <button className="reset-btn" onClick={onResetAll}>
          🗑️ Nollaa kisa
        </button>
      )}
    </div>
  );
}
