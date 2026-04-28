// Enum des rôles utilisateur — définit les niveaux d'accès dans l'application
// ADMIN  : accès complet (créer/supprimer des utilisateurs, toutes les ressources)
// MEMBER : accès standard (créer des tâches, modifier son profil)
// VIEWER : accès en lecture seule
export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}
