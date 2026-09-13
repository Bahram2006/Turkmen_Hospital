import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
    extends PrismaClient<Prisma.PrismaClientOptions, 'query'>
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'info' },
                { emit: 'stdout', level: 'warn' },
                { emit: 'stdout', level: 'error' },
            ],
            errorFormat: 'colorless',
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Successfully connected to PostgreSQL database');

            // Optional: Log queries in development for debugging
            if (process.env.NODE_ENV !== 'production') {
                this.$on('query', (e: Prisma.QueryEvent) => {
                    this.logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
                });
            }
        } catch (error) {
            const err = error as Error;
            this.logger.error('Failed to connect to the database', err.stack);
            throw error;
        }
    }

    async onModuleDestroy() {
        this.logger.warn('Disconnecting from PostgreSQL database...');
        await this.$disconnect();
        this.logger.log('Database connection closed successfully');
    }
}