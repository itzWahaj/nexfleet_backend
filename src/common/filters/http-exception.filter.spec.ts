import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function mockHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('maps a 404 to the NOT_FOUND envelope', () => {
    const { host, status, json } = mockHost();
    filter.catch(
      new HttpException('Hub not found', HttpStatus.NOT_FOUND),
      host,
    );
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Hub not found' },
    });
  });

  it('maps class-validator arrays to VALIDATION_ERROR', () => {
    const { host, json } = mockHost();
    filter.catch(
      new HttpException(
        { message: ['name should not be empty', 'city must be a string'] },
        HttpStatus.BAD_REQUEST,
      ),
      host,
    );
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'name should not be empty; city must be a string',
      },
    });
  });

  it('does not leak unknown exceptions', () => {
    const { host, status, json } = mockHost();
    filter.catch(new Error('password_hash column missing'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });
});
