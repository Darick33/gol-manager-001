import { Matches } from 'class-validator';

const HEX_COLOR = /^#([A-Fa-f0-9]{6})$/;

export class SetColorsDto {
  @Matches(HEX_COLOR, { message: 'homeColor debe ser un color hex válido (#RRGGBB)' })
  homeColor: string;

  @Matches(HEX_COLOR, { message: 'awayColor debe ser un color hex válido (#RRGGBB)' })
  awayColor: string;
}
