async function test() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBz7q6jHwcDFifxhCFz2TI9P1fidaI15ys`);
    const data = await response.json();
    console.log(data.models.map(m => m.name).join('\n'));
  } catch (err) {
    console.error(err);
  }
}
test();
