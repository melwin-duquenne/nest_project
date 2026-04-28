// Filtre d'exceptions global — intercepte toutes les erreurs non gérées et renvoie une réponse JSON uniforme
// Appliqué dans main.ts avec app.useGlobalFilters()
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

// @Catch() sans argument = intercepte TOUS les types d'exceptions
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Une erreur interne est survenue';

    if (exception instanceof HttpException) {
      // Exceptions NestJS standard (NotFoundException, ForbiddenException, etc.)
      status = exception.getStatus();
      const res = exception.getResponse();
      // Extrait le tableau de messages de validation de class-validator si présent
      message = typeof res === 'object' && 'message' in res
        ? (res as { message: string | string[] }).message
        : exception.message;
    } else if (exception instanceof QueryFailedError) {
      // Erreur PostgreSQL : code 23505 = violation de contrainte unique (email déjà existant)
      const err = exception as QueryFailedError & { code?: string };
      if (err.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'Cette ressource existe déjà (contrainte d\'unicité)';
      } else {
        this.logger.error(`QueryFailedError: ${exception.message}`);
      }
    } else {
      // Erreur inattendue — logue la stack trace pour faciliter le débogage
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    }

    // Format de réponse d'erreur uniforme pour tous les cas
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
