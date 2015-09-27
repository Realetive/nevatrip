<?php
$table = 'modx_trip_orders';

$data = array(
    'trip_id'                        => '16',
    'sum'                            => '0',
    'trip_date'                      => '29.08.2015',
    'trip_time'                      => '10:00',
    'tickets[ticket_1_adult][price]' => '1690',
    'tickets[ticket_1_adult][c]'     => '1',
    'tickets[ticket_1_child][price]' => '750',
    'tickets[ticket_1_child][c]'     => '1',
    'cps_email'                      => 'realetive@yandex.ru',
    'fullname'                       => 'Ганин none Роман',
    'cps_phone'                      => '+79216556291',
    'paymentType'                    => 'PC',
    'promocode'                      => 'тотал' );

$isFullDiscount = false;

function checkIsFullDiscount( $promocode, $resource_id, &$discount, &$modx ) {
    $discount = 0;
    /*
     * Check promocode
     */
    if( !empty( $promocode ) ) {
        // Get promocodes by resource id
        $e_promocodes = $modx->getObject( 'modTemplateVarResource', array(
            'tmplvarid' => 28,
            'contentid' => $resource_id
        ) );

        if( $e_promocodes ){
            $e_promocodes = (string) mb_strtolower( $e_promocodes->get( 'value' ), 'UTF-8' );
            preg_match( '/\[' . $promocode . '\]\(([0-9]+)\)/', $e_promocodes, $matches );
            if(isset($matches[1])){
                $discount = $matches[1];
                if($matches[1] == 100){
                    return true;
                }
            }
        }
    }

    return false;
}

/*
 * Check total sum
 */
if( empty( $data[ 'sum' ] ) || !empty( $data[ 'promocode' ] ) ) {
    $isFullDiscount = checkIsFullDiscount(mb_strtolower($data['promocode'], 'UTF-8'), $data['trip_id'], $discount, $modx);

    if(empty($data['sum']) && !$isFullDiscount){
        $realSum = 0;
        foreach($data['tickets'] as $ticket){
            $realSum += $ticket['price'] * $ticket['c'];
        }
        $realSum = ceil(($realSum * (100 - $discount)) / 100);
        $data['sum'] = $realSum;
    }
    if($isFullDiscount){
        $data['sum'] = 0;
    }
}
/*
 * Transform tickets to another format
 */
foreach($data['tickets'] as $name => $ticket){
    if($ticket['c'] > 0){
        $data[$name . '_price'] = $ticket['price'];
        $data[$name . '_c'] = $ticket['c'];
    }
}
unset($data['tickets']);

/*
 * Add more information
 */
$data['customerNumber'] = $data['cps_email'];
$data['created'] = date('Y-m-d H:i:s');

if ( $data['sum'] = 0 && $isFullDiscount) {
    $data['status'] = 'promo';
} else {
    $data['status'] = 'new';
}

/*
 * Save to DB
 */
$fields = implode(',', array_keys($data));

$forSave = array();
foreach($data as $field => $value){
    $forSave[':' . $field] = $value;
}

$values = implode(',', array_keys($forSave));

$sql = "INSERT INTO modx_trip_orders(" . $fields . ") VALUES(" . $values . ");";

$query = new xPDOCriteria($modx, $sql, $forSave);

if ($query->prepare() && $query->stmt->execute()){
    /*
     * If success save show form for redirect to payment system
     */
    $data['orderNumber'] = $modx->lastInsertId();

    if ( $data['status'] == 'promo' ) {
        return 'Билет успешно создан. Спасибо.';
    } else {
        unset($data['status']);
        unset($data['created']);

        $inputs = '';
        foreach ($data as $name => $value) {
            $inputs .= $modx->getChunk('tpl_FormHiddenInput', compact('name', 'value'));
        }
        return $modx->getChunk('tpl_FormYaOrder', compact('inputs'));
    }
}