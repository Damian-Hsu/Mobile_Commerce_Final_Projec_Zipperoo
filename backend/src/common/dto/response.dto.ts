export class ResponseDto<T> {
  statusCode: number;
  message: string;
  data: T;

  constructor(statusCode: number, message: string, data: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static success<T>(data: T, message: string = '操作成功'): ResponseDto<T> {
    return new ResponseDto(200, message, data);
  }

  static created<T>(data: T, message: string = '創建成功'): ResponseDto<T> {
    return new ResponseDto(201, message, data);
  }

  static error(message: string, statusCode: number = 400): ResponseDto<null> {
    return new ResponseDto(statusCode, message, null);
  }
} 