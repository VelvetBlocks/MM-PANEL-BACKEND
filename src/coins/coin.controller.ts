import { Controller, Post, Body } from '@nestjs/common';
import { CoinsService } from './coin.service';
import { Coins, Exchange } from './entities/coin.entity';
import {
  BotStatusUpdateDto,
  CreateCoinDto,
  FindExcCoinsDto,
  UpdateCoinDto,
} from './dto/create-coin.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

@ApiTags('coins')
@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Coin created successfully', type: Coins })
  @ApiBearerAuth()
  @Post('create')
  create(@Body() data: CreateCoinDto) {
    return this.coinsService.create(data);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Coins get successfully', type: [Coins] })
  @ApiBearerAuth()
  @Post('get')
  findAll() {
    return this.coinsService.findAll();
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Coin get successfully', type: Coins })
  @ApiBearerAuth()
  @Post('get_exc')
  findExcCoins(@Body() dto: FindExcCoinsDto) {
    return this.coinsService.findExcCoins(dto.exchange);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Volume bot setting get successfully',
    type: Coins,
  })
  @ApiBearerAuth()
  @Post('status')
  statusUpdate(@Body() dto: BotStatusUpdateDto) {
    return this.coinsService.statusUpdate(dto);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Coin get successfully', type: Coins })
  @ApiBearerAuth()
  @Post('update')
  update(@Body() data: UpdateCoinDto) {
    return this.coinsService.update(data.id, data);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ description: 'Coin get successfully', type: Coins })
  @ApiBearerAuth()
  @Post('delete')
  remove(@Body('id') id: number) {
    return this.coinsService.remove(id);
  }
}
