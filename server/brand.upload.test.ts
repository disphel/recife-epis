import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';

describe('Brand Logo Upload', () => {
  it('should upload logo and return URL', async () => {
    const caller = appRouter.createCaller({} as any);
    
    // Create a simple base64 image (1x1 red pixel PNG)
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const result = await caller.brand.uploadLogo({
      base64Data: base64Image,
      fileName: 'test-logo.png',
      contentType: 'image/png'
    });
    
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('key');
    expect(result.url).toContain('http');
    expect(result.key).toContain('logos/');
  });
  
  it('should handle different image formats', async () => {
    const caller = appRouter.createCaller({} as any);
    
    // Test with JPG
    const base64Jpg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA==';
    
    const result = await caller.brand.uploadLogo({
      base64Data: base64Jpg,
      fileName: 'test-logo.jpg',
      contentType: 'image/jpeg'
    });
    
    expect(result).toHaveProperty('url');
    expect(result.key).toMatch(/\.(jpg|jpeg)$/);
  });
});
