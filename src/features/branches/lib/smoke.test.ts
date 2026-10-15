describe('test setup', () => {
  it('runs in jsdom with jest-dom matchers', () => {
    document.body.innerHTML = '<p>hello</p>'
    expect(document.querySelector('p')).toBeInTheDocument()
  })
})
