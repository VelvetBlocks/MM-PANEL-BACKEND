import {
  Controller,
  Post,
  Body,
  SerializeOptions,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { VolumeBotSettingsService } from './vol-bot-setting.service';
import { VolumeBotSettings } from './entities/vol-bot-setting.entity';
import { UpdateVolumeBotSettingsDto } from './dto/vol-bot-setting.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { GetBalanceHistoryDto } from './dto/balance-history.dto';

@ApiTags('vol-bot-setting')
@Controller('vol-bot-setting')
export class VolBotSettingsController {
  constructor(private readonly volumeBotSettingsService: VolumeBotSettingsService) {}

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Volume bot setting get successfully',
    type: VolumeBotSettings,
  })
  @ApiBearerAuth()
  @Post('update')
  update(@ActiveUser('id') userId: string, @Body() dto: UpdateVolumeBotSettingsDto) {
    return this.volumeBotSettingsService.update(userId, dto.id, dto);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Volume bot setting get successfully',
    type: VolumeBotSettings,
  })
  @ApiBearerAuth()
  @Post('reset')
  reset(@Body('id') id: number) {
    return this.volumeBotSettingsService.resetBalances(id);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Volume bot setting get successfully',
    type: [VolumeBotSettings],
  })
  @ApiBearerAuth()
  @Post('get_all')
  getAll() {
    return this.volumeBotSettingsService.getAll();
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Volume bot setting get successfully',
    type: [VolumeBotSettings],
  })
  @ApiBearerAuth()
  @Post('get')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ groups: ['withCreds'] })
  getByCoin(@Body('coinId') coinId: number) {
    return this.volumeBotSettingsService.getByCoin(coinId);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Volume bot setting get successfully',
    type: [VolumeBotSettings],
  })
  @ApiBearerAuth()
  @Post('get_bal_history')
  getBalanceHistoryByCoin(@Body() dto: GetBalanceHistoryDto) {
    return this.volumeBotSettingsService.getBalanceHistoryByCoin(
      dto.exchange,
      dto.symbol,
      dto.page,
      dto.pageSize,
    );
  }
}
