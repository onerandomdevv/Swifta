import { PartialType } from "@nestjs/mapped-types";
import { CreateSupplierProductDto } from "./create-supplier-product.dto";

export class UpdateSupplierProductDto extends PartialType(
  CreateSupplierProductDto,
) {}
