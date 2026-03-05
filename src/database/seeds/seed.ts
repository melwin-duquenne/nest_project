import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../../users/entities/user.entity';
import { Team } from '../../teams/entities/team.entity';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { UserRole } from '../../users/interfaces/user.interface';
import { ProjectStatus } from '../../projects/dto/create-project.dto';
import { TaskPriority, TaskStatus } from '../../tasks/dto/create-task.dto';

async function seed() {
  await AppDataSource.initialize();
  console.log('✔ Connexion base de données établie');

  // --- Vider les tables dans le bon ordre ---
  await AppDataSource.query(
    'TRUNCATE comments, tasks, projects, team_members, teams, users CASCADE',
  );
  console.log('✔ Tables vidées');

  const userRepo = AppDataSource.getRepository(User);
  const teamRepo = AppDataSource.getRepository(Team);
  const projectRepo = AppDataSource.getRepository(Project);
  const taskRepo = AppDataSource.getRepository(Task);
  const commentRepo = AppDataSource.getRepository(Comment);

  // --- Utilisateurs ---
  const [hashAlice, hashBob, hashCharlie] = await Promise.all([
    bcrypt.hash('password123', 10),
    bcrypt.hash('password123', 10),
    bcrypt.hash('password123', 10),
  ]);

  const alice = userRepo.create({
    email: 'alice@example.com',
    name: 'Alice',
    role: UserRole.ADMIN,
    passwordHash: hashAlice,
  });
  const bob = userRepo.create({
    email: 'bob@example.com',
    name: 'Bob',
    role: UserRole.MEMBER,
    passwordHash: hashBob,
  });
  const charlie = userRepo.create({
    email: 'charlie@example.com',
    name: 'Charlie',
    role: UserRole.VIEWER,
    passwordHash: hashCharlie,
  });

  await userRepo.save([alice, bob, charlie]);
  console.log('✔ 3 utilisateurs créés (alice, bob, charlie)');

  // --- Équipes ---
  const alpha = teamRepo.create({
    name: 'Alpha',
    description: 'Équipe principale',
    members: [alice, bob],
  });
  const beta = teamRepo.create({
    name: 'Beta',
    description: 'Équipe secondaire',
    members: [charlie],
  });

  await teamRepo.save([alpha, beta]);
  console.log('✔ 2 équipes créées (Alpha, Beta)');

  // --- Projets ---
  const project1 = projectRepo.create({
    name: 'Projet TaskFlow',
    description: 'Application de gestion de tâches',
    status: ProjectStatus.ACTIVE,
    team: alpha,
  });
  const project2 = projectRepo.create({
    name: 'Projet Dashboard',
    description: 'Tableau de bord analytique',
    status: ProjectStatus.DRAFT,
    team: alpha,
  });

  await projectRepo.save([project1, project2]);
  console.log('✔ 2 projets créés rattachés à Alpha');

  // --- Tâches ---
  const task1 = taskRepo.create({
    title: 'Mettre en place la CI/CD',
    description: 'Configurer GitHub Actions pour les tests et le déploiement',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    project: project1,
    assignee: alice,
  });
  const task2 = taskRepo.create({
    title: 'Rédiger la documentation API',
    description: 'Documenter tous les endpoints avec Swagger',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    project: project1,
    assignee: bob,
  });
  const task3 = taskRepo.create({
    title: 'Corriger le bug de pagination',
    description: 'La pagination ne fonctionne pas correctement sur /tasks',
    status: TaskStatus.DONE,
    priority: TaskPriority.LOW,
    project: project1,
    assignee: bob,
  });

  await taskRepo.save([task1, task2, task3]);
  console.log('✔ 3 tâches créées sur le projet TaskFlow');

  // --- Commentaires ---
  const comment1 = commentRepo.create({
    content: 'Je commence la configuration de GitHub Actions.',
    author: alice,
    task: task1,
  });
  const comment2 = commentRepo.create({
    content: "J'ai trouvé la source du bug, fix en cours.",
    author: bob,
    task: task3,
  });

  await commentRepo.save([comment1, comment2]);
  console.log('✔ 2 commentaires créés');

  await AppDataSource.destroy();
  console.log('✔ Connexion fermée — seed terminé');
}

seed().catch((err) => {
  console.error('Erreur pendant le seed :', err);
  process.exit(1);
});
