export interface IDatabaseHealthRepository {
  checkConnection(): Promise<boolean>;
}
