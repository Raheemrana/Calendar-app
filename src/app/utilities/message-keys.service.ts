import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CommonMessagingKeys {
  public readonly ERROR_NAME_MISSING: string = 'Name is required.';
  public readonly ERROR_NAME_LENGTH: string = 'Name must be of at least 3 characters';
  public readonly ERROR_DESCRIPTION_LENGTH: string = 'Description cannot exceed 500 characters.';
}
