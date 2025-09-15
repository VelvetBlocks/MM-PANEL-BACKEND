import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderLog } from '../entities/order-log.entity';
import { CreateOrderLogDto } from '../dto/order-log.dot';
import { Exchange } from 'src/coins/entities/coin.entity';

@Injectable()
export class OrderLogService {
  constructor(
    @InjectRepository(OrderLog)
    private readonly orderLogRepository: Repository<OrderLog>,
  ) {}

  // Add a new log entry
  async createLog(dto: CreateOrderLogDto): Promise<OrderLog> {
    const log = this.orderLogRepository.create({
      exchange: dto.exchange,
      symbol: dto.symbol,
      type: dto.type,
      text: dto.text,
      orderDate: dto.date ?? null, // optional field
    });

    return await this.orderLogRepository.save(log);
  }

  // Get all logs
  async getAllLogs(exchange: Exchange, symbol: string): Promise<OrderLog[]> {
    return await this.orderLogRepository.find({
      where: { exchange, symbol },
      order: { createdAt: 'DESC' }, // latest first
    });
  }

  // (Optional) Get single log by ID
  async getLogById(id: number): Promise<OrderLog> {
    const log = await this.orderLogRepository.findOne({ where: { id } });
    if (!log) throw new NotFoundException(`Log with ID ${id} not found`);
    return log;
  }
}
