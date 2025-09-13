import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exchange } from 'src/coins/entities/coin.entity';
import { Balance } from './entities/balances.entity';
import { CreateBalanceDto } from './dto/create-balance.dto';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(Balance)
    private readonly balanceRepo: Repository<Balance>,
  ) {}

  /** Create or update balance (Upsert style) */
  async upsert(dto: CreateBalanceDto): Promise<Balance> {
    let balance = await this.balanceRepo.findOne({
      where: { userId: dto.userId, exchange: dto.exchange, asset: dto.asset },
    });

    if (!balance) {
      balance = this.balanceRepo.create(dto);
    } else {
      balance.free = dto.free;
      balance.locked = dto.locked;
      balance.available = dto.available;
    }

    return await this.balanceRepo.save(balance);
  }

  /** Get all balances for a user */
  async findAllByUser(userId: string): Promise<Balance[]> {
    return await this.balanceRepo.find({
      where: { userId },
      order: { asset: 'ASC' },
    });
  }

  /** Get balances by exchange */
  async findByExchange(userId: string, exchange: Exchange): Promise<Balance[]> {
    return await this.balanceRepo.find({
      where: { userId, exchange },
      order: { asset: 'ASC' },
    });
  }

  /** Get balance for specific asset */
  async findOne(userId: string, exchange: Exchange, asset: string): Promise<Balance> {
    const balance = await this.balanceRepo.findOne({
      where: { userId, exchange, asset },
    });
    if (!balance) {
      throw new NotFoundException(
        `Balance for ${asset} on ${exchange} not found for user ${userId}`,
      );
    }
    return balance;
  }

  /** Delete balance */
  async remove(userId: string, exchange: Exchange, asset: string): Promise<void> {
    const balance = await this.findOne(userId, exchange, asset);
    await this.balanceRepo.remove(balance);
  }
}
