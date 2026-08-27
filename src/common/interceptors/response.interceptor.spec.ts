import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

function mockContext(statusCode: number): ExecutionContext {
  return {
    switchToHttp: () => ({
      getResponse: () => ({ statusCode }),
    }),
  } as unknown as ExecutionContext;
}

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor();

  it('wraps a 200 body in the success envelope', async () => {
    const next: CallHandler = { handle: () => of({ status: 'ok' }) };
    const result = await lastValueFrom(
      interceptor.intercept(mockContext(200), next),
    );
    expect(result).toEqual({
      success: true,
      data: { status: 'ok' },
    });
  });

  it('sets success=false when the handler used a 5xx status', async () => {
    const next: CallHandler = { handle: () => of({ status: 'degraded' }) };
    const result = await lastValueFrom(
      interceptor.intercept(mockContext(503), next),
    );
    expect(result.success).toBe(false);
    expect(result.data).toEqual({ status: 'degraded' });
  });
});
