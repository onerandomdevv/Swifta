import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ApiResponse } from "@twizrr/shared";

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Prevent double wrapping if the data already contains the 'success' and 'data' envelope
        if (
          data &&
          typeof data === "object" &&
          "success" in data &&
          "data" in data
        ) {
          return data;
        }

        return {
          success: true,
          data: data,
        };
      }),
    );
  }
}
