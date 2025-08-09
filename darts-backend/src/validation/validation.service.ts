import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ValidationService {
  /**
   * Validates if a string is a valid MongoDB ObjectId
   * @param id - ID to validate
   * @throws BadRequestException if invalid
   */
  isMongoId(id: any): void {
    if (typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id)) {
      throw new BadRequestException(`The parameter passed as team id is not valid: '${id}'`);
    }
  }
}
