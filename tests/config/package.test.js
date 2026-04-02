import { readFileSync } from 'fs';
import { join } from 'path';

describe('package.json', () => {
  it('has required dependencies', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
    expect(pkg.dependencies).toHaveProperty('electron');
    expect(pkg.dependencies).toHaveProperty('react');
    expect(pkg.dependencies).toHaveProperty('react-dom');
    expect(pkg.devDependencies).toHaveProperty('typescript');
    expect(pkg.devDependencies).toHaveProperty('vite');
    expect(pkg.devDependencies).toHaveProperty('@types/node');
    expect(pkg.devDependencies).toHaveProperty('@types/react');
    expect(pkg.devDependencies).toHaveProperty('@types/react-dom');
  });
});