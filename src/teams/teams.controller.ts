import { Body, Controller, Get, Post } from '@nestjs/common'
import { TeamsService } from './teams.service'

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Body() body: { name: string; code: string; flag_url?: string }) {
    return this.teamsService.create(body.name, body.code, body.flag_url)
  }

  @Get()
  findAll() {
    return this.teamsService.findAll()
  }
}
