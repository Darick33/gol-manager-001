describe('test infrastructure', () => {
  it('vitest + jest-dom are wired up', () => {
    const div = document.createElement('div');
    div.textContent = 'hola';
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
  });
});
