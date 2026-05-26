import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body != null) {
        const body = event.body as Record<string, unknown>;
        if (body['success'] !== undefined && body['data'] !== undefined) {
          return event.clone({ body: body['data'] as object });
        }
      }
      return event;
    })
  );
};
