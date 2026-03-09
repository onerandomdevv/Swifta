import { PartialType } from "@nestjs/mapped-types";
import { CreateSharedQuoteDto } from "./create-shared-quote.dto";

export class UpdateSharedQuoteDto extends PartialType(CreateSharedQuoteDto) {}
