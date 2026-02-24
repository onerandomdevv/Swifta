import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateRFQDto } from './create-rfq.dto';

export class UpdateRFQDto extends PartialType(
  OmitType(CreateRFQDto, ['targetMerchantId', 'productId', 'unlistedItemDetails'] as const)
) {}
