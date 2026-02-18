import { Test, TestingModule } from '@nestjs/testing';
import { RFQService } from './rfq.service';

describe('RFQService', () => {
  let service: RFQService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RFQService],
    }).compile();

    service = module.get<RFQService>(RFQService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
