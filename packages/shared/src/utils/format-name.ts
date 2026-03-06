/**
 * Compose a display name from structured name fields.
 */
export function getDisplayName(
  user?: {
    firstName?: string;
    middleName?: string | null;
    lastName?: string;
  } | null,
): string {
  if (!user) return "";
  return [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

/**
 * Get initials (2 characters max) from the user's first and last name.
 */
export function getInitials(
  user?: {
    firstName?: string;
    lastName?: string;
  } | null,
): string {
  if (!user) return "";
  return (
    (user.firstName?.[0] || "") + (user.lastName?.[0] || "")
  ).toUpperCase();
}
