import { typeormCliOptions, typeormNestOptions } from './typeorm.options';

describe('TypeORM options', () => {
  it('never enables synchronize in the Nest connection', () => {
    expect(
      typeormNestOptions(
        'postgres://nexfleet:nexfleet@localhost:5432/nexfleet',
        'development',
      ).synchronize,
    ).toBe(false);
  });

  it('never enables synchronize in the CLI DataSource', () => {
    expect(
      typeormCliOptions(
        'postgres://nexfleet:nexfleet@localhost:5432/nexfleet',
        'development',
      ).synchronize,
    ).toBe(false);
  });
});
