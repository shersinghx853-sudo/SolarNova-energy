const supabaseUrl = "https://mntuubsqlqodqrnaetbo.supabase.co";
const supabaseKey = "YOUR_SUPABASE_PUBLISHABLE_KEY";

const sb = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;

const plans = [
  {name:"SolarNova Basic", price:500, duration:15},
  {name:"SolarNova Standard", price:1000, duration:15},
  {name:"SolarNova Premium", price:2500, duration:15}
];

function $(id){
  return document.getElementById(id);
}

function showMessage(text){
  if($("authMessage")) $("authMessage").textContent = text;
}

function setMode(mode){
  $("tabLogin").classList.toggle("selected", mode === "login");
  $("tabRegister").classList.toggle("selected", mode === "register");

  $("mobileField").hidden = mode === "login";
  $("refField").hidden = mode === "login";
  $("authSubmit").textContent = mode === "login"
    ? "Login"
    : "Create account";
}

$("tabLogin").onclick = () => setMode("login");
$("tabRegister").onclick = () => setMode("register");

$("authForm").onsubmit = async (e) => {
  e.preventDefault();

  const email = $("email").value.trim();
  const password = $("password").value;

  if($("tabRegister").classList.contains("selected")){
    const name = $("mobile").value.trim();

    const {data, error} = await sb.auth.signUp({
      email,
      password,
      options:{
        data:{
          name: name || "SolarNova Member"
        }
      }
    });

    if(error){
      showMessage(error.message);
      return;
    }

    showMessage("Account created. Please verify your email if required.");
    return;
  }

  const {data, error} = await sb.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    showMessage(error.message);
    return;
  }

  currentUser = data.user;
  await loadDashboard();
};

async function loadDashboard(){
  $("auth").hidden = true;
  $("dashboard").hidden = false;

  const name =
    currentUser.user_metadata?.name ||
    currentUser.email?.split("@")[0] ||
    "SolarNova Member";

  $("welcomeName").textContent = name;

  $("balance").textContent = "₹0";
  $("devices").textContent = "0";
  $("income").textContent = "₹0";
}

function openPage(page){
  const content = $("pageContent");

  if(page === "plans"){
    content.innerHTML = `
      ${plans.map((p,i)=>`
        <div class="plan">
          <h3>${p.name}</h3>
          <p>Service package · ${p.duration} days</p>
          <div class="price">₹${p.price}</div>
          <button onclick="activatePlan(${i})">Activate</button>
        </div>
      `).join("")}
    `;
    $("page").scrollIntoView({behavior:"smooth"});
  }

  if(page === "withdraw"){
    content.innerHTML = `
      <h3>Withdraw</h3>
      <input id="withdrawAmount" type="number" placeholder="Amount">
      <input id="upiId" type="text" placeholder="UPI ID">
      <button onclick="submitWithdraw()">Submit request</button>
    `;
    $("page").scrollIntoView({behavior:"smooth"});
  }

  if(page === "transactions"){
    content.innerHTML = `
      <h3>Transactions</h3>
      <p>Your transaction history will appear here.</p>
    `;
    $("page").scrollIntoView({behavior:"smooth"});
  }

  if(page === "referral"){
    content.innerHTML = `
      <h3>Referral</h3>
      <p>Your referral code will be connected to your account.</p>
    `;
    $("page").scrollIntoView({behavior:"smooth"});
  }
}

function activatePlan(index){
  const plan = plans[index];

  alert(
    plan.name +
    " selected for ₹" +
    plan.price +
    ". Payment verification will be added later."
  );
}

function submitWithdraw(){
  const amount = Number($("withdrawAmount").value);
  const upi = $("upiId").value.trim();

  if(!amount || amount <= 0){
    alert("Enter a valid amount.");
    return;
  }

  if(!upi){
    alert("Enter your UPI ID.");
    return;
  }

  alert("Withdrawal request submitted for review.");
}

$("logoutBtn").onclick = async () => {
  await sb.auth.signOut();
  location.reload();
};

(async()=>{
  const {data} = await sb.auth.getSession();

  if(data.session){
    currentUser = data.session.user;
    await loadDashboard();
  }else{
    setMode("register");
  }
})();
