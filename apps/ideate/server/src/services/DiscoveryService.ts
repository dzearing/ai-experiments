import Bonjour, { type Service } from 'bonjour-service';
import { DocumentService } from './DocumentService.js';

const SERVICE_TYPE = 'ideate';
const SERVICE_PORT = 3002;

export class DiscoveryService {
  private bonjour: Bonjour | null = null;
  private publishedService: Service | null = null;
  private documentService: DocumentService;
  private browser: ReturnType<Bonjour['find']> | null = null;
  private discoveredServices: Map<string, Service> = new Map();

  constructor() {
    this.documentService = new DocumentService();
  }

  /**
   * Start the mDNS discovery service.
   */
  start(): void {
    try {
      this.bonjour = new Bonjour();

      // Publish our service
      this.publishService();

      // Browse for other services
      this.startBrowsing();

      console.log('Discovery service started');
    } catch (error) {
      console.error('Failed to start discovery service:', error);
    }
  }

  /**
   * Stop the mDNS discovery service.
   */
  stop(): void {
    if (this.publishedService) {
      this.publishedService.stop();
      this.publishedService = null;
    }

    if (this.browser) {
      this.browser.stop();
      this.browser = null;
    }

    if (this.bonjour) {
      this.bonjour.destroy();
      this.bonjour = null;
    }

    this.discoveredServices.clear();
    console.log('Discovery service stopped');
  }

  /**
   * Publish our service on the network.
   */
  private publishService(): void {
    if (!this.bonjour) return;

    this.publishedService = this.bonjour.publish({
      name: `Ideate-${process.env.HOSTNAME || 'localhost'}`,
      type: SERVICE_TYPE,
      port: SERVICE_PORT,
      txt: {
        version: '1.0.0',
        hostname: process.env.HOSTNAME || 'localhost',
      },
    });

    console.log(`Published Ideate service on port ${SERVICE_PORT}`);
  }

  /**
   * Browse for other Ideate services on the network.
   */
  private startBrowsing(): void {
    if (!this.bonjour) return;

    this.browser = this.bonjour.find({ type: SERVICE_TYPE });

    this.browser.on('up', (service: Service) => {
      console.log('Discovered Ideate service:', service.name);
      this.discoveredServices.set(service.name, service);
    });

    this.browser.on('down', (service: Service) => {
      console.log('Lost Ideate service:', service.name);
      this.discoveredServices.delete(service.name);
    });
  }

  /**
   * Get all discovered services.
   */
  getDiscoveredServices(): Service[] {
    return Array.from(this.discoveredServices.values());
  }

  /**
   * Update the service advertisement with document info.
   */
  async updateAdvertisement(): Promise<void> {
    if (!this.bonjour || !this.publishedService) return;

    try {
      const publicDocs = await this.documentService.getPublicDocuments();

      // Stop current service
      this.publishedService.stop();

      // Republish with updated info
      this.publishedService = this.bonjour.publish({
        name: `Ideate-${process.env.HOSTNAME || 'localhost'}`,
        type: SERVICE_TYPE,
        port: SERVICE_PORT,
        txt: {
          version: '1.0.0',
          hostname: process.env.HOSTNAME || 'localhost',
          documentCount: String(publicDocs.length),
          documents: JSON.stringify(
            publicDocs.slice(0, 5).map((d) => ({
              id: d.id,
              title: d.title,
            }))
          ),
        },
      });
    } catch (error) {
      console.error('Failed to update advertisement:', error);
    }
  }
}
