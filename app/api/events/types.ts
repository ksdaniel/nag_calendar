export interface AirtableAttachment {
  id: string;
  width: number;
  height: number;
  url: string;
  filename: string;
  size: number;
  type: string;
  thumbnails: {
    small: {
      url: string;
      width: number;
      height: number;
    };
    large: {
      url: string;
      width: number;
      height: number;
    };
    full: {
      url: string;
      width: number;
      height: number;
    };
  };
}

export interface EventFields {
  zi: string; // Day (e.g., "Vineri", "Sâmbătă")
  Loc: string; // Location
  titlu: string; // Title
  "ora deschidere": string; // Opening time
  "ora închidere": string; // Closing time
  "start date": string; // ISO date string
  "End date": string; // ISO date string
  Link?: string; // Optional URL link
  Attachments?: AirtableAttachment[]; // Optional attachments
}

export interface Event {
  id: string; // Airtable record ID
  zi: string;
  Loc: string;
  titlu: string;
  "ora deschidere": string;
  "ora închidere": string;
  "start date": string;
  "End date": string;
  Link?: string;
  Attachments?: AirtableAttachment[];
}

export interface ApiResponse {
  events: Event[];
  count: number;
}
