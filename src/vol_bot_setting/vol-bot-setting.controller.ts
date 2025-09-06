import { Controller, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { VolumeBotSettingsService } from './vol-bot-setting.service';
import { VolumeBotSettings } from './entities/vol-bot-setting.entity';
import { BotStatusUpdateDto, UpdateVolumeBotSettingsDto } from './dto/vol-bot-setting.dto';

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
  update(@Body() dto: UpdateVolumeBotSettingsDto) {
    return this.volumeBotSettingsService.update(dto.id, dto);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Volume bot setting get successfully',
    type: VolumeBotSettings,
  })
  @ApiBearerAuth()
  @Post('status')
  statusUpdate(@Body() dto: BotStatusUpdateDto) {
    return this.volumeBotSettingsService.statusUpdate(dto.id, dto);
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
  getByCoin(@Body('coinId') coinId: number) {
    return this.volumeBotSettingsService.getByCoin(coinId);
  }
}
