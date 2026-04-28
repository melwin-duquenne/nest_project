// Intercepteur de logging — enregistre chaque requête HTTP avec sa méthode, URL, status et durée
// Appliqué globalement dans main.ts avec app.useGlobalInterceptors()
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface HttpRequest { method: string; url: string; }
interface HttpResponse { statusCode: number; }

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<HttpRequest>();
    const res = context.switchToHttp().getResponse<HttpResponse>();
    const { method, url } = req;
    const start = Date.now();

    // next.handle() exécute le handler de la route et retourne un Observable
    // tap() permet d'agir après la réponse sans modifier le flux
    return next.handle().pipe(
      tap({
        // Succès : logue méthode + URL + code HTTP + durée
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(`${method} ${url} ${res.statusCode} [${ms}ms]`);
        },
        // Erreur : logue avec WARN pour les distinguer des logs normaux
        error: (err: Error) => {
          const ms = Date.now() - start;
          this.logger.warn(`${method} ${url} ERROR ${err.message} [${ms}ms]`);
        },
      }),
    );
  }
}
