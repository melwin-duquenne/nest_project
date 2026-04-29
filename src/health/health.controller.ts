// Contrôleur de santé — expose GET /api/health pour vérifier l'état de l'application
// Utilisé par Docker (HEALTHCHECK) et les outils de monitoring pour savoir si l'app tourne
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Vérifie que PostgreSQL est accessible en envoyant un ping
      () => this.db.pingCheck('database'),
    ]);
  }
}
